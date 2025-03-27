env = "dev"

# vpc
vpc_id = "vpc-0332201122cb57bd6"

# vpc endpoint
space_vpc_endpoint_s3 = "vpce-051a9a901fdcaedd3"
space_vpc_endpoint_ssm = "vpce-0d0f907d17ca440d5"
space_vpc_endpoint_ssmmessages = "vpce-0cfac4ea5197b6a2e"
vdl_vpc_endpoint_ecr_api = "vpce-0accd7304bba81d19"
vdl_vpc_endpoint_ecr_dkr = "vpce-08a51e6ca20038439"

# subnet
space_public_azA_cidr = "172.16.128.0/20"
space_private_azA_cidr = "172.16.144.0/20"
space_private_azC_cidr = "172.16.160.0/20"
collection_private_azA_cidr = "172.16.208.0/20"
vdl_private_azA_cidr = "172.16.176.0/20"
vdl_private_azC_cidr = "172.16.192.0/20"
api_private_azA_cidr = "172.16.16.0/20"
api_private_azC_cidr = "172.16.48.0/20"

# internet gateway
igw_id = "igw-08ae11c57b715ccf2"

# ec2 instance
space_ec2_bastion_ip = "172.16.144.7"
space_ec2_azA_spatialIdSearch_ip = "172.16.144.10"
space_ec2_azC_spatialIdSearch_ip = "172.16.160.10"
collection_ec2_azA_tier4_ip = "172.16.208.10"
collection_ec2_azA_halex_ip = "172.16.208.20"
vdl_ec2_azA_eks_work_ip = "172.16.176.11"