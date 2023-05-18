terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.37.0"
    }
  }
}

provider aws {
  region = "ap-southeast-3"
}

provider aws {
  alias = "apsoutheast3"
  region = "ap-southeast-3"
}
provider aws {
  alias = "useast1"
  region = "us-east-1"
}

module beacon_api {
  source = "./modules/api"
  beacon-id = var.beacon-id
  beacon-name = var.beacon-name
  organisation-id = var.organisation-id
  organisation-name = var.organisation-name

  providers = {
    aws = aws
    aws.useast1 = aws.useast1
  }
}

module update_data {
  source = "./modules/update"
  bucket-name = var.bucket-name
  beacon_api_url = module.beacon_api.api_url
}

module beacon_website {
  source = "./modules/website"
  beacon_api_url = module.beacon_api.api_cloudfront_url
  domain_name = var.domain_name
  max_web_requests_per_ip_in_five_minutes = var.max_website_requests_per_ip_in_five_minutes
  production = var.production
  response_bucket_domain = module.beacon_api.response_bucket_url
  okta_domain = var.okta_domain
  okta_client_id = var.okta_client_id

  providers = {
    aws = aws
    aws.useast1 = aws.useast1
  }
}
