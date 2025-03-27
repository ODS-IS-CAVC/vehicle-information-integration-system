output "space_rtb_public_id" {
  value = aws_route_table.space_rtb_public.id
}

output "space_rtb_private_id" {
  value = aws_route_table.space_rtb_private.id
}

output "space_ngw_private_id" {
  value = aws_nat_gateway.space_ngw_private.id
}