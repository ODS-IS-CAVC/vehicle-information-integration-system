locals {
  subSystem = "vdl"
  name = "${var.env}-${local.subSystem}"

  common_tag = {
    Environment = var.env
    Owner = "TIG"
    Project = "DigiLine"
    ManagedBy = "terraform"
  }

}

resource "aws_security_group" "vdl_sg_vpcEndpoint" {
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
    description = "HTTPS from collection_private_azA_cidr"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.collection_private_azA_cidr]
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

resource "aws_vpc_endpoint_security_group_association" "vdl_vpc_endpoint_asscoc_ecr_api" {
  vpc_endpoint_id   = var.vdl_vpc_endpoint_ecr_api
  security_group_id = aws_security_group.vdl_sg_vpcEndpoint.id
}

resource "aws_vpc_endpoint_security_group_association" "vdl_vpc_endpoint_asscoc_ecr_dkr" {
  vpc_endpoint_id   = var.vdl_vpc_endpoint_ecr_dkr
  security_group_id = aws_security_group.vdl_sg_vpcEndpoint.id
}