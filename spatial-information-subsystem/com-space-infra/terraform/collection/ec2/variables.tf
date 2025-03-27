variable "env" {}
variable "vpc_id" {}
variable "space_private_azA_cidr" {}
variable "space_private_azC_cidr" {}
variable "collection_private_azA_cidr" {}
variable "space_ec2_bastion_ip" {}
variable "collection_ec2_azA_tier4_ip" {}
variable "collection_ec2_azA_halex_ip" {}
variable "collection_subnet_private_azA_id" {
  type = string
}
