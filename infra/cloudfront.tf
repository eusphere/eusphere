# Shared shape lives in ./modules/cloudfront; per-tenant inputs below.

module "eusphere_co" {
  source = "./modules/cloudfront"

  aliases = [
    "www.eusphere.co",
    "eusphere.co",
  ]
  origin_id                = "s3-eusphere"
  origin_path              = "/eusphere-co"
  origin_access_control_id = "E2020DPKXTFUA9"
  viewer_protocol_policy   = "allow-all"
  acm_certificate_arn      = "arn:aws:acm:us-east-1:930597685973:certificate/329e0009-e83e-4a6a-92dc-cf481e27e106"
  web_acl_id               = "arn:aws:wafv2:us-east-1:930597685973:global/webacl/CreatedByCloudFront-8481eed2-5d15-4b17-ad9b-c324b8c2f208/d32b12f7-a258-45f0-9f8c-181eaee261ff"
}

module "monarchy" {
  source = "./modules/cloudfront"

  aliases = [
    "www.monarchy1.com",
    "monarchy1.com",
  ]
  origin_id                = "s3-monarchy"
  origin_path              = "/monarchy-com"
  origin_access_control_id = "EUGRSHISKZIBM"
  viewer_protocol_policy   = "redirect-to-https"
  acm_certificate_arn      = "arn:aws:acm:us-east-1:930597685973:certificate/7f11d4cd-e9b6-45b3-921e-cd7669420174"
  web_acl_id               = "arn:aws:wafv2:us-east-1:930597685973:global/webacl/CreatedByCloudFront-02796dd7-dda3-4c13-bb63-d60deb222e22/fd575ff9-103b-44bb-832c-3ba7318383b9"
}

module "connieadu_com" {
  source = "./modules/cloudfront"

  aliases = [
    "www.connieadu.com",
    "connieadu.com",
  ]
  origin_id                = "s3-connieadu-com"
  origin_path              = "/connieadu-com"
  # Same OAC as eusphere_co: one OAC can serve multiple distributions to this bucket.
  origin_access_control_id = "E2020DPKXTFUA9"
  viewer_protocol_policy   = "redirect-to-https"
  acm_certificate_arn      = "arn:aws:acm:us-east-1:930597685973:certificate/4c35ff56-ae0a-404c-916f-0c3c36435dff"
}
