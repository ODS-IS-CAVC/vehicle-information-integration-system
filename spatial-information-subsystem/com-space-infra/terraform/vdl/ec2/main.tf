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

# セキュリティグループ
resource "aws_security_group" "vdl_sg_ec2" {
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
    description = "from EKS"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.vdl_private_azA_cidr]
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
## work
resource "aws_network_interface" "vdl_ec2_eks_work_nic" {
  subnet_id       = var.vdl_subnet_private_azA_id
  private_ips     = [var.vdl_ec2_azA_eks_work_ip]
  security_groups = [aws_security_group.vdl_sg_ec2.id]
}

module "ec2_eks_work" {
  source  = "terraform-aws-modules/ec2-instance/aws"
  version = "4.3.0"

  name = "${local.name}-ec2-eks-work"

  ami                    = "ami-0f7246821e0bf25a4"
  instance_type          = "t2.small"
  key_name               = "iia-digiline-com-keypair"

  network_interface = [
    {
    network_interface_id = aws_network_interface.vdl_ec2_eks_work_nic.id
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
