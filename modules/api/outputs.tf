output api_cloudfront_url {
  value = "https://${aws_cloudfront_distribution.api_cloudfront_distribution.domain_name}"
  description = "URL for API hosted by cloudfront."
}
output api_url {
  value = aws_api_gateway_deployment.BeaconApi.invoke_url
  description = "URL used to invoke the API."
}

output response_bucket_url {
  value = aws_s3_bucket.large_response_bucket.bucket_domain_name
  description = "URL used to access S3 responses."
}
