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

# セキュリティグループ
## azA
resource "aws_security_group" "space_sg_ec2_azA" {
  vpc_id = var.vpc_id
  name   = "${local.name}-sg-forEC2-azA"

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
    description = "from ELB"
    from_port   = 8081
    to_port     = 8081
    protocol    = "tcp"
    cidr_blocks = [var.space_private_azA_cidr]
  }

  ingress {
    description = "from ELB"
    from_port   = 8082
    to_port     = 8082
    protocol    = "tcp"
    cidr_blocks = [var.space_private_azA_cidr]
  }

  ingress {
    description = "from Elasticache for Redis"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.space_private_azA_cidr]
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

## azC
resource "aws_security_group" "space_sg_ec2_azC" {
  vpc_id = var.vpc_id
  name   = "${local.name}-sg-forEC2-azC"

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
    description = "from ELB"
    from_port   = 8081
    to_port     = 8081
    protocol    = "tcp"
    cidr_blocks = [var.space_private_azC_cidr]
  }

  ingress {
    description = "from ELB"
    from_port   = 8082
    to_port     = 8082
    protocol    = "tcp"
    cidr_blocks = [var.space_private_azC_cidr]
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
## azA
resource "aws_network_interface" "space_ec2_azA_spatialIdSearch_nic" {
  subnet_id       = var.space_subnet_private_azA_id
  private_ips     = [var.space_ec2_azA_spatialIdSearch_ip]
  security_groups = [aws_security_group.space_sg_ec2_azA.id]
}

module "ec2_azA_spatialIdSearch" {
  source  = "terraform-aws-modules/ec2-instance/aws"
  version = "4.3.0"

  name = "${local.name}-ec2-azASpatialIdSearch"

  ami                    = "ami-0cab37bd176bb80d3"
  instance_type          = "m5.xlarge"
  key_name               = "iia-digiline-com-keypair"

  network_interface = [
    {
    network_interface_id = aws_network_interface.space_ec2_azA_spatialIdSearch_nic.id
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

## azC
resource "aws_network_interface" "space_ec2_azC_spatialIdSearch_nic" {
  subnet_id       = var.space_subnet_private_azC_id
  private_ips     = [var.space_ec2_azC_spatialIdSearch_ip]
  security_groups = [aws_security_group.space_sg_ec2_azC.id]
}

module "ec2_azC_spatialIdSearch" {
  source  = "terraform-aws-modules/ec2-instance/aws"
  version = "4.3.0"

  name = "${local.name}-ec2-azCSpatialIdSearch"

  ami                    = "ami-0cab37bd176bb80d3"
  instance_type          = "m5.xlarge"
  key_name               = "iia-digiline-com-keypair"

  network_interface = [
    {
    network_interface_id = aws_network_interface.space_ec2_azC_spatialIdSearch_nic.id
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