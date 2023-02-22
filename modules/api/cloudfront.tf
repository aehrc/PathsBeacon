locals {
  origin_id = "BeaconAPI"
}

resource aws_cloudfront_distribution api_cloudfront_distribution {

  origin {
    domain_name = "${aws_api_gateway_rest_api.BeaconApi.id}.execute-api.${data.aws_region.current.name}.amazonaws.com"
    origin_id = local.origin_id
    origin_path = "/${aws_api_gateway_deployment.BeaconApi.stage_name}"

    custom_origin_config {
      http_port = 80
      https_port = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols = ["TLSv1.2"]
    }
  }

  enabled = true
  is_ipv6_enabled = true

  web_acl_id = aws_cloudformation_stack.api_waf_acl.outputs["ApiAclArn"]

  default_cache_behavior {
    allowed_methods = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]
    cached_methods = ["GET", "HEAD"]
    target_origin_id = local.origin_id
    forwarded_values {
      query_string = true

      cookies {
        forward = "none"
      }
    }
    viewer_protocol_policy = "https-only"
    min_ttl = 0
    default_ttl = 0
    max_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
