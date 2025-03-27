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

# ルートテーブル作成
resource "aws_route_table" "space_rtb_public" {
  vpc_id = var.vpc_id
  tags   = merge(
    {Name = "${local.name}-rtb-InazAPublicSubnetOnMainVPC"},
    local.common_tag
  )
}

resource "aws_route_table" "space_rtb_private" {
  vpc_id = var.vpc_id
  tags   = merge(
    {Name = "${local.name}-rtb-InazAPrivateSubnetOnMainVPC"},
    local.common_tag
  )
}

# ルートテーブルとサブネットの関連付け
resource "aws_route_table_association" "space_rtb_asscoc_public" {
  route_table_id = aws_route_table.space_rtb_public.id
  subnet_id      = var.space_subnet_public_azA_id
}

resource "aws_route_table_association" "space_rtb_asscoc_private_azA" {
  route_table_id = aws_route_table.space_rtb_private.id
  subnet_id      = var.space_subnet_private_azA_id
}

resource "aws_route_table_association" "space_rtb_asscoc_private_azC" {
  route_table_id = aws_route_table.space_rtb_private.id
  subnet_id      = var.space_subnet_private_azC_id
}

# インターネットゲートウェイとの関連付け（public）
resource "aws_route" "space_route_public_igw" {
  route_table_id         = aws_route_table.space_rtb_public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = var.igw_id
}

# NATゲートウェイ作成
resource "aws_eip" "nat_gateway" {
  vpc = true
  tags   = merge(
    {Name = "${local.name}-natgw-eip"},
    local.common_tag
  )
}

resource "aws_nat_gateway" "space_ngw_private" {
  allocation_id = aws_eip.nat_gateway.id
  subnet_id         = var.space_subnet_public_azA_id
  tags   = merge(
    {Name = "${local.name}-natgw-azAPublicSubnetInMainVPC"},
    local.common_tag
  )
}

# NATゲートウェイとの関連付け（private）
resource "aws_route" "space_route_private_ngw" {
  route_table_id         = aws_route_table.space_rtb_private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.space_ngw_private.id
}