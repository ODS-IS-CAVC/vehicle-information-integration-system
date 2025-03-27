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
resource "aws_security_group" "space_sg_bastion" {
  vpc_id = var.vpc_id
  name   = "${local.name}-sg-forBastion"

  ingress {
    description = "SSH from 0.0.0.0/0"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from 0.0.0.0/0"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
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
resource "aws_network_interface" "space_ec2_bastion_nic" {
  subnet_id       = var.space_subnet_private_azA_id
  private_ips     = [var.space_ec2_bastion_ip]
  security_groups = [aws_security_group.space_sg_bastion.id]
}

module "ec2_bastion" {
  source  = "terraform-aws-modules/ec2-instance/aws"
  version = "4.3.0"

  name = "${local.name}-ec2-bastion"

  ami                    = "ami-0f75d1a8c9141bd00"
  instance_type          = "t2.micro"
  key_name               = "iia-digiline-com-keypair"
  iam_instance_profile   = var.iam_instance_profile_systems_manager_name

  network_interface = [
    {
    network_interface_id = aws_network_interface.space_ec2_bastion_nic.id
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
