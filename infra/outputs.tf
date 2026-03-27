output "website_bucket_name" {
  value = aws_s3_bucket.frontend.bucket
}

output "website_url" {
  value = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
}

output "api_base_url" {
  value = aws_apigatewayv2_api.http_api.api_endpoint
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.entries.name
}

output "lambda_function_name" {
  value = aws_lambda_function.api.function_name
}