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
resource "aws_security_group" "vdl_sg_eks" {
  vpc_id = var.vpc_id
  name   = "${local.name}-sg-forEKS"

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
    description = "from space_private_azA_cidr"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.space_private_azA_cidr]
  }

  ingress {
    description = "from space_private_azC_cidr"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.space_private_azC_cidr]
  }

  ingress {
    description = "from collection_private_azA_cidr"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.collection_private_azA_cidr]
  }

  ingress {
    description = "from vdl_private_azA_cidr"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.vdl_private_azA_cidr]
  }

  ingress {
    description = "from vdl_private_azC_cidr"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
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

# IAMロール
## EKS Cluster
data "aws_iam_policy_document" "vdl_eks_cluster_assume_iamrole_policy_document" {
  version = "2012-10-17"
  statement {
    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
    effect  = "Allow"
  }
}

resource "aws_iam_role" "vdl_eks_cluster_iamrole" {
  name               = "${local.name}-iamrole-eksClusterRole"
  assume_role_policy = data.aws_iam_policy_document.vdl_eks_cluster_assume_iamrole_policy_document.json
}

resource "aws_iam_role_policy_attachment" "vdl_eks_cluster_iamrole_AmazonEKSClusterPolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = "${aws_iam_role.vdl_eks_cluster_iamrole.name}"
}

resource "aws_iam_role_policy_attachment" "vdl_eks_cluster_iamrole_AmazonEKSServicePolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSServicePolicy"
  role       = "${aws_iam_role.vdl_eks_cluster_iamrole.name}"
}

## EKS Nodegroup
data "aws_iam_policy_document" "vdl_eks_nodegroup_assume_iamrole_policy_document" {
  version = "2012-10-17"
  statement {
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
    effect  = "Allow"
  }
}

resource "aws_iam_role" "vdl_eks_nodegroup_iamrole" {
  name               = "${local.name}-iamrole-eksNodegroupRole"
  assume_role_policy = data.aws_iam_policy_document.vdl_eks_nodegroup_assume_iamrole_policy_document.json
}

resource "aws_iam_role_policy_attachment" "vdl_eks_nodegroup-role-AmazonEKSWorkerNodePolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = "${aws_iam_role.vdl_eks_nodegroup_iamrole.name}"
}

resource "aws_iam_role_policy_attachment" "vdl_eks_nodegroup-role-AmazonEKS_CNI_Policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = "${aws_iam_role.vdl_eks_nodegroup_iamrole.name}"
}

resource "aws_iam_role_policy_attachment" "vdl_eks_nodegroup-role-AmazonEC2ContainerRegistryReadOnly" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = "${aws_iam_role.vdl_eks_nodegroup_iamrole.name}"
}

resource "aws_iam_role_policy_attachment" "vdl_eks_nodegroup-role-AmazonSSMManagedInstanceCore" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  role       = "${aws_iam_role.vdl_eks_nodegroup_iamrole.name}"
}

data "template_file" "eks_cluster" {
  template = "${file("${path.module}/templates/eks_cluster.tpl")}"

  vars = {
    vdl_eks_cluster_name              = "${local.name}-eks-cluster"
    vpc_id                            = var.vpc_id
    vdl_subnet_private_azA_id         = var.vdl_subnet_private_azA_id
    vdl_subnet_private_azC_id         = var.vdl_subnet_private_azC_id
    vdl_eks_cluster_iamrole_arn       = aws_iam_role.vdl_eks_cluster_iamrole.arn
    vdl_eks_cluster_security_group    = aws_security_group.vdl_sg_eks.id
  }
}

data "template_file" "eks_nodegroup" {
  template = "${file("${path.module}/templates/eks_nodegroup.tpl")}"

  vars = {
    vdl_eks_cluster_name              = "${local.name}-eks-cluster"
    vdl_eks_nodegroup_name            = "${local.name}-eks-ng01"
    vdl_eks_nodegroup_iamrole_arn     = aws_iam_role.vdl_eks_nodegroup_iamrole.arn
    vdl_eks_nodegroup_security_groups = aws_security_group.vdl_sg_eks.id
  }
}

resource "null_resource" "vdl_eks_cluster" {
  provisioner "local-exec" {
      command = "echo '${data.template_file.eks_cluster.rendered}' > ${path.module}/outputs/${var.env}_vdl_eks_cluster.yaml"
  }
  triggers = {
      template = "${data.template_file.eks_cluster.rendered}"
  }
}

resource "null_resource" "vdl_eks_nodegroup" {
  provisioner "local-exec" {
      command = "echo '${data.template_file.eks_nodegroup.rendered}' > ${path.module}/outputs/${var.env}_vdl_eks_nodegroup.yaml"
  }
  triggers = {
      template = "${data.template_file.eks_nodegroup.rendered}"
  }
}
