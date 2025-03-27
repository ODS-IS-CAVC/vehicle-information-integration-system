variable "region" {
  type    = string
  default = "ap-northeast-1"
}

variable "env" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "space_public_azA_cidr" {
  type = string
}

variable "space_private_azA_cidr" {
  type = string
}

variable "space_private_azC_cidr" {
  type = string
}

variable "collection_private_azA_cidr" {
  type = string
}

variable "vdl_private_azA_cidr" {
  type = string
}

variable "vdl_private_azC_cidr" {
  type = string
}

variable "api_private_azA_cidr" {
  type = string
}

variable "api_private_azC_cidr" {
  type = string
}

variable "igw_id" {
  type = string
}

variable "space_ec2_bastion_ip" {
  type = string
}

variable "space_ec2_azA_spatialIdSearch_ip" {
  type = string
}

variable "space_ec2_azC_spatialIdSearch_ip" {
  type = string
}

variable "collection_ec2_azA_tier4_ip" {
  type = string
}

variable "collection_ec2_azA_halex_ip" {
  type = string
}

variable "vdl_ec2_azA_eks_work_ip" {
  type = string
}

variable "space_vpc_endpoint_s3" {
  type = string
}

variable "space_vpc_endpoint_ssm" {
  type = string
}

variable "space_vpc_endpoint_ssmmessages" {
  type = string
}

variable "vdl_vpc_endpoint_ecr_api" {
  type = string
}

variable "vdl_vpc_endpoint_ecr_dkr" {
  type = string
}