terraform {
  backend "s3" {
    bucket  = "poc-tig-s3-terraform-state"
    key     = "terraform.tfstate"
    region  = "ap-northeast-1"
    encrypt = true
    shared_credentials_file = "~/.aws/credentials"
    profile = "digiline"
  }
}

