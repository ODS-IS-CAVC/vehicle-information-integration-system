locals {
  subSystem = "vdl"
  name = "${var.env}-${local.subSystem}"

  common_tag = {
    Environment = var.env
    Owner = "TIG"
    Project = "DigiLine"
    ManagedBy = "terraform"
  }

}

resource "aws_s3_bucket" "vdl_s3_datasource" {
  bucket = "${local.name}-s3-datasource"
}

resource "aws_s3_bucket_object" "vdl_s3_datasource_halex" {
  bucket = aws_s3_bucket.vdl_s3_datasource.id
  key    = "provider-halex/weather/weather-information-collector/"
}

resource "aws_s3_bucket_object" "vdl_s3_datasource_tier4_vehicle" {
  bucket = aws_s3_bucket.vdl_s3_datasource.id
  key    = "provider-tier4/vehicle/vehicle-information-collector/"
}

resource "aws_s3_bucket_object" "vdl_s3_datasource_tier4_target" {
  bucket = aws_s3_bucket.vdl_s3_datasource.id
  key    = "provider-tier4/target/target-information-collector/"
}