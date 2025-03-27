variable "env" {}
variable "vpc_id" {}
variable "space_private_azA_cidr" {}
variable "space_private_azC_cidr" {}
variable "space_ec2_bastion_ip" {}
variable "space_ec2_azA_spatialIdSearch_ip" {}
variable "space_ec2_azC_spatialIdSearch_ip" {}
variable "space_subnet_private_azA_id" {
  type = string
}
variable "space_subnet_private_azC_id" {
  type = string
}
