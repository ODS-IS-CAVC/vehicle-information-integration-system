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
resource "aws_security_group" "space_sg_lb" {
  vpc_id = var.vpc_id
  name   = "${local.name}-sg-forLB"

  ingress {
    description = "form MSE"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = [var.api_private_azA_cidr]
  }

  ingress {
    description = "from MSE"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = [var.api_private_azC_cidr]
  }

  ingress {
    description = "from space subnet"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = [var.space_private_azA_cidr]
  }

  ingress {
    description = "from space subnet"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = [var.space_private_azC_cidr]
  }

  ingress {
    description = "from space subnet"
    from_port   = 8080
    to_port     = 8080
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

# alb
resource "aws_alb" "space_alb" {
  name               = "${local.name}-alb-spatialIdSearch"
  internal           = true
  security_groups    = [aws_security_group.space_sg_lb.id]
  subnets            = [var.space_subnet_private_azA_id, var.space_subnet_private_azC_id]

  tags = merge(
    local.common_tag
  )
}

# albのターゲットグループ
resource "aws_alb_target_group" "space_tg_alb_vehicle" {
  name        = "${local.name}-tg-alb-vehicle"
  port        = 8081
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "instance"

  health_check {
    interval            = 30
    path                = "/actuator/health"
    port                = 8081
    protocol            = "HTTP"
    healthy_threshold   = 3
    unhealthy_threshold = 3
  }
}

resource "aws_alb_target_group" "space_tg_alb_weather" {
  name        = "${local.name}-tg-alb-weather"
  port        = 8082
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "instance"

  health_check {
    interval            = 30
    path                = "/actuator/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    healthy_threshold   = 3
    unhealthy_threshold = 3
  }
}

# albのターゲットグループへの紐づけ
resource "aws_alb_target_group_attachment" "space_tg_alb_attachment_azA_vehicle" {
  target_group_arn = aws_alb_target_group.space_tg_alb_vehicle.arn
  target_id        = var.space_ec2_azA_spatialIdSearch_id
  port             = 8081
}

resource "aws_alb_target_group_attachment" "space_tg_alb_attachment_azC_vehicle" {
  target_group_arn = aws_alb_target_group.space_tg_alb_vehicle.arn
  target_id        = var.space_ec2_azC_spatialIdSearch_id
  port             = 8081
}

resource "aws_alb_target_group_attachment" "space_tg_alb_attachment_azA_weather" {
  target_group_arn = aws_alb_target_group.space_tg_alb_weather.arn
  target_id        = var.space_ec2_azA_spatialIdSearch_id
  port             = 8082
}

resource "aws_alb_target_group_attachment" "space_tg_alb_attachmexzt_azC_weather" {
  target_group_arn = aws_alb_target_group.space_tg_alb_weather.arn
  target_id        = var.space_ec2_azC_spatialIdSearch_id
  port             = 8082
}

# albのリスナー設定
resource "aws_alb_listener" "space_listener_alb" {
  load_balancer_arn = aws_alb.space_alb.arn
  port              = 8090
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.space_tg_alb_vehicle.arn
  }
}

# リスナーのルール
resource "aws_alb_listener_rule" "space_listener_rule_alb_vehicle" {
  listener_arn = aws_alb_listener.space_listener_alb.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.space_tg_alb_vehicle.arn
  }

  condition {
    path_pattern {
      values = ["*/cav/api/space/v1/vehicles"]
    }
  }
}

resource "aws_alb_listener_rule" "space_listener_rule_alb_weather" {
  listener_arn = aws_alb_listener.space_listener_alb.arn
  priority     = 200

  action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.space_tg_alb_weather.arn
  }

  condition {
    path_pattern {
      values = ["*/cav/api/space/v1/weathers"]
    }
  }
}

resource "aws_alb_listener_rule" "space_listener_rule_alb_target" {
  listener_arn = aws_alb_listener.space_listener_alb.arn
  priority     = 300

  action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.space_tg_alb_vehicle.arn
  }

  condition {
    path_pattern {
      values = ["*/cav/api/space/v1/targets"]
    }
  }
}