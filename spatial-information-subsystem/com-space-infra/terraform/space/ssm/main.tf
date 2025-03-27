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

data "aws_iam_policy_document" "assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "role" {
  name               = "${local.name}-iamrole-ssm"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
  tags   = merge(
    local.common_tag
  )
}

data "aws_iam_policy" "systems_manager" {
  arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "default" {
  role       = aws_iam_role.role.name
  policy_arn = data.aws_iam_policy.systems_manager.arn
}

resource "aws_iam_instance_profile" "systems_manager" {
  name = "${local.name}-sm-Profile"
  role = aws_iam_role.role.name
}

# VPCエンドポイントへの紐づけ
resource "aws_vpc_endpoint_route_table_association" "space_vpc_endpoint_asscoc_s3_public" {
  route_table_id  = var.space_rtb_public_id
  vpc_endpoint_id = var.space_vpc_endpoint_s3
}

resource "aws_vpc_endpoint_route_table_association" "space_vpc_endpoint_asscoc_s3_private" {
  vpc_endpoint_id = var.space_vpc_endpoint_s3
  route_table_id  = var.space_rtb_private_id
}

resource "aws_security_group" "space_sg_vpcEndpoint" {
  vpc_id = var.vpc_id
  name   = "${local.name}-sg-vpcEndpointForMainVPC"

  ingress {
    description = "HTTPS from space_private_azA_cidr"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.space_private_azA_cidr]
  }

  ingress {
    description = "HTTPS from space_private_azC_cidr"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.space_private_azC_cidr]
  }

  ingress {
    description = "HTTPS from vdl_private_azA_cidr"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vdl_private_azA_cidr]
  }

  ingress {
    description = "HTTPS from vdl_private_azC_cidr"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vdl_private_azC_cidr]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags   = merge(
    local.common_tag
  )
}

resource "aws_vpc_endpoint_security_group_association" "space_vpc_endpoint_asscoc_ssm" {
  vpc_endpoint_id   = var.space_vpc_endpoint_ssm
  security_group_id = aws_security_group.space_sg_vpcEndpoint.id
}

resource "aws_vpc_endpoint_security_group_association" "space_vpc_endpoint_asscoc_ssmmessages" {
  vpc_endpoint_id   = var.space_vpc_endpoint_ssmmessages
  security_group_id = aws_security_group.space_sg_vpcEndpoint.id
}