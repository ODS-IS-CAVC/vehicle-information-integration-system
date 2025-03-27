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

# ルートテーブル作成
resource "aws_route_table" "collection_rtb_private" {
  vpc_id = var.vpc_id
  tags   = merge(
    {Name = "${local.name}-rtb-InazAPrivateSubnetOnMainVPC"},
    local.common_tag
  )
}

# ルートテーブルとサブネットの関連付け
resource "aws_route_table_association" "collection_rtb_asscoc_private" {
  route_table_id = aws_route_table.collection_rtb_private.id
  subnet_id      = var.collection_subnet_private_azA_id
}

# NATゲートウェイとの関連付け
resource "aws_route" "collection_route_private_ngw" {
  route_table_id         = aws_route_table.collection_rtb_private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = var.space_ngw_private_id
}
