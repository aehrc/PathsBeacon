resource aws_cloudformation_stack api_waf_acl {
  provider = aws.useast1
  name = "ApiWafAcl"
  template_body = file("${path.module}/waf_cf.yaml")
  on_failure = "DELETE"

  parameters = {
    "maxRequestsPerFiveMinutes" = var.max_api_requests_per_ip_in_five_minutes
  }
}
