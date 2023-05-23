resource aws_s3_bucket_notification updateDataset {
  bucket = var.bucket-name

  lambda_function {
    lambda_function_arn = module.lambda-updateData.function_arn
    events = [
      "s3:ObjectCreated:*",
    ]
  }

  depends_on = [aws_lambda_permission.S3updateData]
}
