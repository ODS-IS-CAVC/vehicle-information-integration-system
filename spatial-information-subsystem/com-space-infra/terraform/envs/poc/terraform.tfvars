env = "poc"

# vpc
vpc_id = "vpc-0649599f98854db5e"

# vpc endpoint
space_vpc_endpoint_s3 = "vpce-06554aa54f61dff00"
space_vpc_endpoint_ssm = "vpce-06513fe8fc7f10f26"
space_vpc_endpoint_ssmmessages = "vpce-06cbc8aae8163bd35"
vdl_vpc_endpoint_ecr_api = "vpce-0b94b64a004f6e18a"
vdl_vpc_endpoint_ecr_dkr = "vpce-0e1e384f3767c4f43"

# subnet
space_public_azA_cidr = "172.17.128.0/20"
space_private_azA_cidr = "172.17.144.0/20"
space_private_azC_cidr = "172.17.160.0/20"
collection_private_azA_cidr = "172.17.208.0/20"
vdl_private_azA_cidr = "172.17.176.0/20"
vdl_private_azC_cidr = "172.17.192.0/20"
api_private_azA_cidr = "172.17.16.0/20"
api_private_azC_cidr = "172.17.48.0/20"

# internet gateway
igw_id = "igw-0d39845c6d3ed68c3"

# ec2 instance
space_ec2_bastion_ip = "172.17.144.7"
space_ec2_azA_spatialIdSearch_ip = "172.17.144.10"
space_ec2_azC_spatialIdSearch_ip = "172.17.160.10"
collection_ec2_azA_tier4_ip = "172.17.208.10"
collection_ec2_azA_halex_ip = "172.17.208.20"
vdl_ec2_azA_eks_work_ip = "172.17.176.11"
