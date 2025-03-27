variable "env" {}
variable "vpc_id" {}
variable "space_public_azA_cidr" {}
variable "space_private_azA_cidr" {}
variable "space_private_azC_cidr" {}
variable "vdl_private_azA_cidr" {}
variable "vdl_private_azC_cidr" {}
variable "space_vpc_endpoint_s3" {}
variable "space_vpc_endpoint_ssm" {}
variable "space_vpc_endpoint_ssmmessages" {}
variable "space_rtb_public_id" {
  type = string
}
variable "space_rtb_private_id" {
  type = string
}
variable "space_subnet_private_azA_id" {
  type = string
}