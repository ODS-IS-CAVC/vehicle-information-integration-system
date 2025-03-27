variable "env" {}
variable "vpc_id" {}
variable "space_ec2_bastion_ip" {}
variable "space_subnet_private_azA_id" {
  type = string
}
variable "iam_instance_profile_systems_manager_name" {
  type = string
}
