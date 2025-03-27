module "space_subnet" {
  source = "../../space/subnet"

  env  = var.env
  vpc_id = var.vpc_id
  space_public_azA_cidr = var.space_public_azA_cidr
  space_private_azA_cidr = var.space_private_azA_cidr
  space_private_azC_cidr = var.space_private_azC_cidr
}

module "space_route_table" {
  source = "../../space/route-table"

  env  = var.env
  vpc_id = var.vpc_id
  igw_id = var.igw_id

  space_subnet_public_azA_id = module.space_subnet.space_subnet_public_azA_id
  space_subnet_private_azA_id = module.space_subnet.space_subnet_private_azA_id
  space_subnet_private_azC_id = module.space_subnet.space_subnet_private_azC_id
}

module "space_ssm" {
  source = "../../space/ssm"

  env  = var.env
  vpc_id = var.vpc_id
  space_public_azA_cidr = var.space_public_azA_cidr
  space_private_azA_cidr = var.space_private_azA_cidr
  space_private_azC_cidr = var.space_private_azC_cidr
  vdl_private_azA_cidr = var.vdl_private_azA_cidr
  vdl_private_azC_cidr = var.vdl_private_azC_cidr
  space_vpc_endpoint_s3 = var.space_vpc_endpoint_s3
  space_vpc_endpoint_ssm = var.space_vpc_endpoint_ssm
  space_vpc_endpoint_ssmmessages = var.space_vpc_endpoint_ssmmessages
  space_rtb_public_id = module.space_route_table.space_rtb_public_id
  space_rtb_private_id = module.space_route_table.space_rtb_private_id
  space_subnet_private_azA_id = module.space_subnet.space_subnet_private_azA_id
}

module "space_ec2_bastion" {
  source = "../../space/ec2-bastion"

  env  = var.env
  vpc_id = var.vpc_id
  space_ec2_bastion_ip = var.space_ec2_bastion_ip
  space_subnet_private_azA_id = module.space_subnet.space_subnet_private_azA_id
  iam_instance_profile_systems_manager_name = module.space_ssm.iam_instance_profile_systems_manager_name
}

module "space_ec2_spatialIdSearch" {
  source = "../../space/ec2-spatialIdSearch"

  env  = var.env
  vpc_id = var.vpc_id
  space_private_azA_cidr = var.space_private_azA_cidr
  space_private_azC_cidr = var.space_private_azC_cidr
  space_ec2_bastion_ip = var.space_ec2_bastion_ip
  space_ec2_azA_spatialIdSearch_ip = var.space_ec2_azA_spatialIdSearch_ip
  space_ec2_azC_spatialIdSearch_ip = var.space_ec2_azC_spatialIdSearch_ip
  space_subnet_private_azA_id = module.space_subnet.space_subnet_private_azA_id
  space_subnet_private_azC_id = module.space_subnet.space_subnet_private_azC_id
}

module "space_alb" {
  source = "../../space/alb"

  env  = var.env
  vpc_id = var.vpc_id
  api_private_azA_cidr = var.api_private_azA_cidr
  api_private_azC_cidr = var.api_private_azC_cidr
  space_private_azA_cidr = var.space_private_azA_cidr
  space_private_azC_cidr = var.space_private_azC_cidr
  collection_private_azA_cidr = var.collection_private_azA_cidr
  space_subnet_private_azA_id = module.space_subnet.space_subnet_private_azA_id
  space_subnet_private_azC_id = module.space_subnet.space_subnet_private_azC_id
  space_ec2_azA_spatialIdSearch_id = module.space_ec2_spatialIdSearch.space_ec2_azA_spatialIdSearch_id
  space_ec2_azC_spatialIdSearch_id = module.space_ec2_spatialIdSearch.space_ec2_azC_spatialIdSearch_id
}

module "space_redis" {
  source = "../../space/redis"

  env  = var.env
  vpc_id = var.vpc_id
  space_private_azA_cidr = var.space_private_azA_cidr
  space_private_azC_cidr = var.space_private_azC_cidr
  collection_private_azA_cidr = var.collection_private_azA_cidr
  space_subnet_private_azA_id = module.space_subnet.space_subnet_private_azA_id
  space_subnet_private_azC_id = module.space_subnet.space_subnet_private_azC_id
}

module "collection_subnet" {
  source = "../../collection/subnet"

  env  = var.env
  vpc_id = var.vpc_id
  collection_private_azA_cidr = var.collection_private_azA_cidr
}

module "collection_route_table" {
  source = "../../collection/route-table"

  env  = var.env
  vpc_id = var.vpc_id

  collection_subnet_private_azA_id = module.collection_subnet.collection_subnet_private_azA_id
  space_ngw_private_id = module.space_route_table.space_ngw_private_id
}

module "collection_ec2" {
  source = "../../collection/ec2"

  env  = var.env
  vpc_id = var.vpc_id
  space_private_azA_cidr = var.space_private_azA_cidr
  space_private_azC_cidr = var.space_private_azC_cidr
  collection_private_azA_cidr = var.collection_private_azA_cidr
  space_ec2_bastion_ip = var.space_ec2_bastion_ip
  collection_ec2_azA_tier4_ip = var.collection_ec2_azA_tier4_ip
  collection_ec2_azA_halex_ip = var.collection_ec2_azA_halex_ip
  collection_subnet_private_azA_id = module.collection_subnet.collection_subnet_private_azA_id
}

module "vdl_subnet" {
  source = "../../vdl/subnet"

  env  = var.env
  vpc_id = var.vpc_id
  vdl_private_azA_cidr = var.vdl_private_azA_cidr
  vdl_private_azC_cidr = var.vdl_private_azC_cidr
}

module "vdl_route_table" {
  source = "../../vdl/route-table"

  env  = var.env
  vpc_id = var.vpc_id

  vdl_subnet_private_azA_id = module.vdl_subnet.vdl_subnet_private_azA_id
  vdl_subnet_private_azC_id = module.vdl_subnet.vdl_subnet_private_azC_id
  space_ngw_private_id = module.space_route_table.space_ngw_private_id
}

module "vdl_ecr" {
  source = "../../vdl/ecr"

  env  = var.env
  vpc_id = var.vpc_id
  space_private_azA_cidr = var.space_private_azA_cidr
  space_private_azC_cidr = var.space_private_azC_cidr
  collection_private_azA_cidr = var.collection_private_azA_cidr
  vdl_private_azA_cidr = var.vdl_private_azA_cidr
  vdl_private_azC_cidr = var.vdl_private_azC_cidr
  vdl_vpc_endpoint_ecr_api = var.vdl_vpc_endpoint_ecr_api
  vdl_vpc_endpoint_ecr_dkr = var.vdl_vpc_endpoint_ecr_dkr
}

module "vdl_ec2" {
  source = "../../vdl/ec2"

  env  = var.env
  vpc_id = var.vpc_id
  vdl_private_azA_cidr = var.vdl_private_azA_cidr
  space_ec2_bastion_ip = var.space_ec2_bastion_ip
  vdl_ec2_azA_eks_work_ip = var.vdl_ec2_azA_eks_work_ip
  vdl_subnet_private_azA_id = module.vdl_subnet.vdl_subnet_private_azA_id
}

module "vdl_eks" {
  source = "../../vdl/eks"

  env  = var.env
  vpc_id = var.vpc_id
  space_ec2_bastion_ip = var.space_ec2_bastion_ip
  space_private_azA_cidr = var.space_private_azA_cidr
  space_private_azC_cidr = var.space_private_azC_cidr
  collection_private_azA_cidr = var.collection_private_azA_cidr
  vdl_private_azA_cidr = var.vdl_private_azA_cidr
  vdl_private_azC_cidr = var.vdl_private_azC_cidr
  vdl_subnet_private_azA_id = module.vdl_subnet.vdl_subnet_private_azA_id
  vdl_subnet_private_azC_id = module.vdl_subnet.vdl_subnet_private_azC_id
}

module "vdl_s3_datasource" {
  source = "../../vdl/s3_datasource"

  env  = var.env
}