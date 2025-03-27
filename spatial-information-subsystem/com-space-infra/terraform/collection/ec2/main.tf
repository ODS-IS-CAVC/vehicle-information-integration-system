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

# セキュリティグループ
resource "aws_security_group" "collection_sg_ec2" {
  vpc_id = var.vpc_id
  name   = "${local.name}-sg-forEC2"

  ingress {
    description = "SSH from bastion"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["${var.space_ec2_bastion_ip}/32"]
  }

  ingress {
    description = "HTTPS from 0.0.0.0/0"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "from Elasticache for Redis"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.space_private_azA_cidr]
  }

  ingress {
    description = "from Elasticache for Redis"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.space_private_azC_cidr]
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

# ec2
## tier4
resource "aws_network_interface" "collection_ec2_tier4_nic" {
  subnet_id       = var.collection_subnet_private_azA_id
  private_ips     = [var.collection_ec2_azA_tier4_ip]
  security_groups = [aws_security_group.collection_sg_ec2.id]
}

module "ec2_tier4" {
  source  = "terraform-aws-modules/ec2-instance/aws"
  version = "4.3.0"

  name = "${local.name}-ec2-tier4"

  ami                    = "ami-0cab37bd176bb80d3"
  instance_type          = "m5.xlarge"
  key_name               = "iia-digiline-com-keypair"

  network_interface = [
    {
    network_interface_id = aws_network_interface.collection_ec2_tier4_nic.id
    device_index         = 0
    }
  ]

  # user_data_base64            = base64encode(local.user_data)
  user_data_replace_on_change = false

  root_block_device = [
    {
      encrypted   = true
      volume_type = "gp3"
      volume_size = 40
    }
  ]

  tags = merge(
    local.common_tag
  )
}

## halex
resource "aws_network_interface" "collection_ec2_halex_nic" {
  subnet_id       = var.collection_subnet_private_azA_id
  private_ips     = [var.collection_ec2_azA_halex_ip]
  security_groups = [aws_security_group.collection_sg_ec2.id]
}

module "ec2_halex" {
  source  = "terraform-aws-modules/ec2-instance/aws"
  version = "4.3.0"

  name = "${local.name}-ec2-halex"

  ami                    = "ami-0cab37bd176bb80d3"
  instance_type          = "m5.xlarge"
  key_name               = "iia-digiline-com-keypair"

  network_interface = [
    {
    network_interface_id = aws_network_interface.collection_ec2_halex_nic.id
    device_index         = 0
    }
  ]

  # user_data_base64            = base64encode(local.user_data)
  user_data_replace_on_change = false

  root_block_device = [
    {
      encrypted   = true
      volume_type = "gp3"
      volume_size = 40
    }
  ]

  tags = merge(
    local.common_tag
  )
}