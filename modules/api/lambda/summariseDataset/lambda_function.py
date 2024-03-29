from collections import Counter
import json
import os

import boto3


DATASETS_TABLE_NAME = os.environ['DATASETS_TABLE']
SUMMARISE_SAMPLE_METADATA_SNS_TOPIC_ARN = os.environ['SUMMARISE_SAMPLE_METADATA_SNS_TOPIC_ARN']
SUMMARISE_VCF_SNS_TOPIC_ARN = os.environ['SUMMARISE_VCF_SNS_TOPIC_ARN']
VCF_SUMMARIES_TABLE_NAME = os.environ['VCF_SUMMARIES_TABLE']

BATCH_GET_MAX_ITEMS = 100

COUNTS = [
    'variantCount',
    'callCount',
    'sampleCount',
]

dynamodb = boto3.client('dynamodb')
s3 = boto3.client('s3')
sns = boto3.client('sns')


def get_etag(vcf_location):
    if not vcf_location.startswith('s3://'):
        return vcf_location
    delimiter_index = vcf_location.find('/', 5)
    kwargs = {
        'Bucket': vcf_location[5:delimiter_index],
        'Key': vcf_location[delimiter_index + 1:],
    }
    print(f"Calling s3.head_object with kwargs: {json.dumps(kwargs)}")
    response = s3.head_object(**kwargs)
    print(f"Received response: {json.dumps(response, default=str)}")
    return response['ETag'].strip('"')


def get_locations(dataset):
    kwargs = {
        'TableName': DATASETS_TABLE_NAME,
        'ProjectionExpression': 'vcfLocations',
        'ConsistentRead': True,
        'KeyConditionExpression': 'id = :id',
        'ExpressionAttributeValues': {
            ':id': {
                'S': dataset,
            },
        },
    }
    print("Querying table: {}".format(json.dumps(kwargs)))
    response = dynamodb.query(**kwargs)
    print("Received response: {}".format(json.dumps(response)))
    return response['Items'][0].get('vcfLocations', {}).get('SS', [])


def get_locations_info(locations):
    items = []
    num_locations = len(locations)
    offset = 0
    kwargs = {
        'RequestItems': {
            VCF_SUMMARIES_TABLE_NAME: {
                'ProjectionExpression': ('vcfLocation,toUpdate,eTag,'
                                         + ','.join(COUNTS)),
                'Keys': [],
            },
        },
    }
    while offset < num_locations:
        to_get = locations[offset:offset+BATCH_GET_MAX_ITEMS]
        kwargs['RequestItems'][VCF_SUMMARIES_TABLE_NAME]['Keys'] = [
            {
                'vcfLocation': {
                    'S': loc,
                },
            } for loc in to_get
        ]
        more_results = True
        while more_results:
            print("batch_get_item: {}".format(json.dumps(kwargs)))
            response = dynamodb.batch_get_item(**kwargs)
            print("Received response: {}".format(json.dumps(response)))
            items += response['Responses'][VCF_SUMMARIES_TABLE_NAME]
            unprocessed_keys = response.get('UnprocessedKeys')
            if unprocessed_keys:
                kwargs['RequestItems'] = unprocessed_keys
            else:
                more_results = False
        offset += BATCH_GET_MAX_ITEMS
    return items


def summarise_dataset(dataset):
    vcf_locations = get_locations(dataset)
    locations_info = get_locations_info(vcf_locations)
    new_locations = set(vcf_locations)
    counts = Counter()
    updated = True
    for location in locations_info:
        vcf_location = location['vcfLocation']['S']
        new_locations.remove(vcf_location)
        if 'toUpdate' in location:
            updated = False
        elif (any(count not in location for count in COUNTS)
              or get_etag(vcf_location) != location.get('eTag', {}).get('S')):
            new_locations.add(vcf_location)
        elif updated:
            counts.update({count: int(location[count]['N'])
                           for count in COUNTS})
    if new_locations:
        updated = False
    if updated:
        # Update sample metadata here to avoid running it twice
        update_sample_metadata(dataset, list(vcf_locations))
        values = {':'+count: {'N': str(counts[count])} for count in COUNTS}
    else:
        values = {':'+count: {'NULL': True} for count in COUNTS}
    update_dataset(dataset, values, new_locations)
    for new_location in new_locations:
        summarise_vcf(new_location)


def summarise_vcf(location):
    kwargs = {
        'TopicArn': SUMMARISE_VCF_SNS_TOPIC_ARN,
        'Message': location,
    }
    print('Publishing to SNS: {}'.format(json.dumps(kwargs)))
    response = sns.publish(**kwargs)
    print('Received Response: {}'.format(json.dumps(response)))


def update_dataset(dataset_id, values, new_locations):
    kwargs = {
        'TableName': DATASETS_TABLE_NAME,
        'Key': {
            'id': {
                'S': dataset_id,
            },
        },
        'UpdateExpression': 'SET ' + ', '.join('{c}=:{c}'.format(c=count)
                                               for count in COUNTS),
        'ExpressionAttributeValues': values,
    }
    if new_locations:
        kwargs['UpdateExpression'] += ', toUpdateFiles=:toUpdateFiles'
        kwargs['ExpressionAttributeValues'][':toUpdateFiles'] = {
            'SS': list(new_locations),
        }
    print('Updating item: {}'.format(json.dumps(kwargs)))
    dynamodb.update_item(**kwargs)


def update_sample_metadata(dataset_id, vcf_locations):
    kwargs = {
        'TopicArn': SUMMARISE_SAMPLE_METADATA_SNS_TOPIC_ARN,
        'Message': json.dumps({
            'dataset_id': dataset_id,
            'vcf_locations': vcf_locations,
        }),
    }
    print('Publishing to SNS: {}'.format(json.dumps(kwargs)))
    response = sns.publish(**kwargs)
    print('Received Response: {}'.format(json.dumps(response)))


def lambda_handler(event, context):
    print('Event Received: {}'.format(json.dumps(event)))
    dataset = event['Records'][0]['Sns']['Message']
    summarise_dataset(dataset)
