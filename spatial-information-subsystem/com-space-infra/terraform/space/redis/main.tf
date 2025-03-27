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
resource "aws_security_group" "space_sg_redis" {
  vpc_id = var.vpc_id
  name   = "${local.name}-sg-forElasticacheForRedis"

  ingress {
    description = "from space azA"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.space_private_azA_cidr]
  }

  ingress {
    description = "from space azC"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.space_private_azC_cidr]
  }

  ingress {
    description = "from collection azA"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.collection_private_azA_cidr]
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

# elasticache for redis
resource "aws_elasticache_subnet_group" "space-subnet-group-redis" {
    name       = "${local.name}-subnet-group-redis"
    subnet_ids = [
        var.space_subnet_private_azA_id,
        var.space_subnet_private_azC_id
    ]
}

resource "aws_elasticache_replication_group" "space-redis-halex" {
  replication_group_id          = "${local.name}-redis-halex"
  description                   = "${local.name}-redis-halex"
  parameter_group_name          = "default.redis7.cluster.on"
  #engine_version                = "7.1"
  node_type                     = "cache.t4g.medium"
  port                          = 6379
  automatic_failover_enabled    = true
  multi_az_enabled              = true
  at_rest_encryption_enabled    = true
  transit_encryption_enabled    = true
  snapshot_retention_limit      = 30
  final_snapshot_identifier     = "${local.name}-redis-halex-final-snapshot"
  subnet_group_name             = aws_elasticache_subnet_group.space-subnet-group-redis.name
  security_group_ids            = [aws_security_group.space_sg_redis.id]
  num_node_groups               = 3
  replicas_per_node_group       = 1

  tags = merge(
    local.common_tag
  )
}

resource "aws_elasticache_replication_group" "space-redis-tier4" {
  replication_group_id          = "${local.name}-redis-tier4"
  description                   = "${local.name}-redis-tier4"
  parameter_group_name          = "default.redis7.cluster.on"
  #engine_version                = "7.1"
  node_type                     = "cache.r7g.large"
  port                          = 6379
  automatic_failover_enabled    = true
  multi_az_enabled              = true
  at_rest_encryption_enabled    = true
  transit_encryption_enabled    = true
  snapshot_retention_limit      = 30
  final_snapshot_identifier     = "${local.name}-redis-tier4-final-snapshot"
  subnet_group_name             = aws_elasticache_subnet_group.space-subnet-group-redis.name
  security_group_ids            = [aws_security_group.space_sg_redis.id]
  num_node_groups               = 3
  replicas_per_node_group       = 1

  tags = merge(
    local.common_tag
  )
}