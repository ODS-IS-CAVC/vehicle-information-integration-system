variable "env" {}
variable "vpc_id" {}
variable "space_ec2_bastion_ip" {}
variable "space_private_azA_cidr" {}
variable "space_private_azC_cidr" {}
variable "collection_private_azA_cidr" {}
variable "vdl_private_azA_cidr" {}
variable "vdl_private_azC_cidr" {}
variable "vdl_subnet_private_azA_id" {
  type = string
}
variable "vdl_subnet_private_azC_id" {
  type = string
}
