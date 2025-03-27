locals {
  subSystem = "collection"
  name = "${var.env}-${local.subSystem}"

  common_tag = {
    Environment = var.env
    Owner = "TIG"
    Project = "DigiLine"
    ManagedBy = "terraform"
  }

}

# private azA
resource "aws_subnet" "collection_subnet_private_azA" {
  vpc_id     = var.vpc_id
  cidr_block = var.collection_private_azA_cidr
  availability_zone = "ap-northeast-1a"

  tags = merge(
    {Name = "${local.name}-subnet-azAPrivateSubnetInMainVPC"},
    local.common_tag
  )
}