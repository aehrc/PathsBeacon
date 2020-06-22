from collections import defaultdict
import csv
import json
from operator import itemgetter
import os
import queue
import re
import threading

import boto3


PERFORM_QUERY = os.environ['PERFORM_QUERY_LAMBDA']
SPLIT_SIZE = int(os.environ['SPLIT_SIZE'])

aws_lambda = boto3.client('lambda')
s3_client = boto3.client('s3')


def get_annotations(annotation_location, variants):
    annotations = []
    covered_variants = set()
    if annotation_location:
        delim_index = annotation_location.find('/', 5)
        bucket = annotation_location[5:delim_index]
        key = annotation_location[delim_index+1:]
        kwargs = {
            'Bucket': bucket,
            'Key': key,
        }
        print(f"Calling s3.get_object with kwargs: {json.dumps(kwargs)}")
        response = s3_client.get_object(**kwargs)
        print(f"Received response: {json.dumps(response, default=str)}")
        iterator = (row.decode('utf-8') for row in response['Body'].iter_lines())
        reader = csv.DictReader(iterator, delimiter='\t')
        for row in reader:
            if row['Variant'] in variants:
                annotations.append({
                    metadata: value
                    for metadata, value in row.items()
                    if value not in {'.', ''}
                })
                covered_variants.add(row['Variant'])
    annotations += [
        {
            'Variant': variant,
        }
        for variant in variants
        if variant not in covered_variants
    ]
    return annotations


def perform_query(region, reference_bases, end_min, end_max, alternate_bases,
                  variant_type, include_details, vcf_location, responses):
    payload = json.dumps({
        'region': region,
        'reference_bases': reference_bases,
        'end_min': end_min,
        'end_max': end_max,
        'alternate_bases': alternate_bases,
        'variant_type': variant_type,
        'include_details': include_details,
        'vcf_location': vcf_location,
    })
    print("Invoking {lambda_name} with payload: {payload}".format(
        lambda_name=PERFORM_QUERY, payload=payload))
    response = aws_lambda.invoke(
        FunctionName=PERFORM_QUERY,
        Payload=payload,
    )
    response_json = response['Payload'].read()
    print("vcf_location='{vcf}', region='{region}':"
          " received payload: {payload}".format(
              vcf=vcf_location, region=region, payload=response_json))
    response_dict = json.loads(response_json)
    # For separating samples by vcf
    response_dict['vcf_location'] = vcf_location
    responses.put(response_dict)


def split_query(dataset, reference_bases, region_start, region_end,
                end_min, end_max, alternate_bases, variant_type,
                include_datasets):
    responses = queue.Queue()
    check_all = include_datasets in ('HIT', 'ALL')
    kwargs = {
        'reference_bases': reference_bases,
        'end_min': end_min,
        'end_max': end_max,
        'alternate_bases': alternate_bases,
        'variant_type': variant_type,
        # Don't bother recording details from MISS, they'll all be 0s
        'include_details': check_all,
        'responses': responses,
    }
    threads = []
    split_start = region_start
    vcf_locations = dataset['vcf_locations']
    while split_start <= region_end:
        split_end = min(split_start + SPLIT_SIZE - 1, region_end)
        for vcf_location, chrom in vcf_locations.items():
            kwargs['region'] = '{}:{}-{}'.format(chrom, split_start,
                                                 split_end)
            kwargs['vcf_location'] = vcf_location
            t = threading.Thread(target=perform_query,
                                 kwargs=kwargs)
            t.start()
            threads.append(t)
        split_start += SPLIT_SIZE

    num_threads = len(threads)
    processed = 0
    all_alleles_count = 0
    variants = defaultdict(lambda: defaultdict(set))
    call_count = 0
    vcf_samples = defaultdict(set)
    exists = False
    while processed < num_threads and (check_all or not exists):
        response = responses.get()
        processed += 1
        if 'exists' not in response:
            # function errored out, ignore
            continue
        exists_in_split = response['exists']
        if exists_in_split:
            exists = True
            if check_all:
                all_alleles_count += response['all_alleles_count']
                call_count += response['call_count']
                vcf_location = response['vcf_location']
                for variant, samples in response['variant_samples'].items():
                    variants[variant][vcf_location].update(samples)
                    vcf_samples[vcf_location].update(samples)
    dataset_sample_count = dataset['sample_count']
    if (include_datasets == 'ALL' or (include_datasets == 'HIT' and exists)
            or (include_datasets == 'MISS' and not exists)):
        annotations = get_annotations(dataset['annotation_location'], variants.keys())
        variant_pattern = re.compile('([0-9]+)(.+)>(.+)')
        for annotation in annotations:
            variant_code = annotation.pop('Variant')
            pos, ref, alt = variant_pattern.fullmatch(variant_code).groups()
            annotation.update({
                'pos': int(pos),
                'ref': ref,
                'alt': alt,
                'sampleCount': sum(
                    len(s)
                    for s in variants[variant_code].values()
                ),
            })
        annotations.sort(key=itemgetter('pos'))
        response_dict = {
            'include': True,
            'datasetId': dataset['dataset_id'],
            'exists': exists,
            'frequency': ((all_alleles_count or call_count and None)
                          and call_count / all_alleles_count),
            'variantCount': len(variants),
            'callCount': call_count,
            'sampleCount': sum(len(samples)
                               for samples in vcf_samples.values()),
            'note': None,
            'externalUrl': None,
            'info': {
                'description': dataset['description'],
                'name': dataset['name'],
                'datasetSampleCount': dataset_sample_count,
                'variants': annotations,
            },
            'error': None,
        }
    else:
        response_dict = {
            'include': False,
            'exists': exists,
        }
    return response_dict


def lambda_handler(event, context):
    print('Event Received: {}'.format(json.dumps(event)))
    dataset = event['dataset']
    reference_bases = event['reference_bases']
    region_start = event['region_start']
    region_end = event['region_end']
    end_min = event['end_min']
    end_max = event['end_max']
    alternate_bases = event['alternate_bases']
    variant_type = event['variant_type']
    include_datasets = event['include_datasets']
    response = split_query(
        dataset=dataset,
        reference_bases=reference_bases,
        region_start=region_start,
        region_end=region_end,
        end_min=end_min,
        end_max=end_max,
        alternate_bases=alternate_bases,
        variant_type=variant_type,
        include_datasets=include_datasets,
    )
    print('Returning response: {}'.format(json.dumps(response)))
    return response
