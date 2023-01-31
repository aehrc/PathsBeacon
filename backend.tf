terraform {
  backend "s3" {
    bucket = "terraform-state-covid19-beacon-gsilab"
    key = "terraform.tfstate"
    region = "ap-southeast-2"
    dynamodb_table = "terraform-state-locks"
  }
}
