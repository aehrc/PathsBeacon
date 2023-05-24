import json
import os
import re
import time

import requests
from aws_requests_auth.aws_auth import AWSRequestsAuth
import boto3

AWS_REGION = os.environ['AWS_REGION']
AWS_ACCESS_KEY_ID = os.environ['AWS_ACCESS_KEY_ID']
AWS_SECRET_ACCESS_KEY = os.environ['AWS_SECRET_ACCESS_KEY']
AWS_SESSION_TOKEN = os.environ['AWS_SESSION_TOKEN']
BEACON_URL = os.environ['BEACON_URL']
MAX_LOCATIONS_TO_CHECK = 100
s3r = boto3.resource('s3')


def lambda_handler(event, _):
    print("Event Received: {}".format(json.dumps(event)))

    bucket_name = event['Records'][0]['s3']['bucket']['name']
    object_key = event['Records'][0]['s3']['object']['key']
    if not re.fullmatch('^gisaid/gisaid0*\\.vcf\\.gz$', object_key):
        print("Not main file, skipping")
        return
    # Wait for other objects to finish being uploaded
    time.sleep(45)
    bucket = s3r.Bucket(bucket_name)
    resp = list(bucket.objects.all())
    all_keys = [d.key for d in resp]
    final_keys = [
        key
        for key in all_keys
        if key.startswith('gisaid/') and key.endswith('vcf.gz')
    ]
    locations = [
        f's3://{bucket_name}/{d}'
        for d in final_keys
    ]
    payload = {
        'id': 'gisaid',
        'vcfLocations': locations,
    }
    if len(locations) > MAX_LOCATIONS_TO_CHECK:
        # This might take too long to check, skip it
        payload['skipCheck'] = 1
    api = BEACON_URL.split('/')[2]

    url = BEACON_URL + '/submit'
    auth = AWSRequestsAuth(
        aws_access_key=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        aws_token=AWS_SESSION_TOKEN,
        aws_host=api,
        aws_region=AWS_REGION,
        aws_service='execute-api',
    )
    print(json.dumps(payload))
    response = requests.patch(url, data=json.dumps(payload), auth=auth)
    print(response)
