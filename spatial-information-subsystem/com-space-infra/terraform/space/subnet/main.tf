locals {
  subSystem = "space"
  name = "${var.env}-${local.subSystem}"

  common_tag = {
    Environment = var.env
    Owner = "TIG"
    Project = "DigiLine"
    ManagedBy = "terraform"
  }

}

# public azA
resource "aws_subnet" "space_subnet_public_azA" {
  vpc_id     = var.vpc_id
  cidr_block = var.space_public_azA_cidr
  availability_zone = "ap-northeast-1a"

  tags = merge(
    {Name = "${local.name}-subnet-azAPublicSubnetInMainVPC"},
    local.common_tag
  )
}

# private azA
resource "aws_subnet" "space_subnet_private_azA" {
  vpc_id     = var.vpc_id
  cidr_block = var.space_private_azA_cidr
  availability_zone = "ap-northeast-1a"

  tags = merge(
    {Name = "${local.name}-subnet-azAPrivateSubnetInMainVPC"},
    local.common_tag
  )
}

# private azC
resource "aws_subnet" "space_subnet_private_azC" {
  vpc_id     = var.vpc_id
  cidr_block = var.space_private_azC_cidr
  availability_zone = "ap-northeast-1c"

  tags = merge(
    {Name = "${local.name}-subnet-azCPrivateSubnetInMainVPC"},
    local.common_tag
  )
}