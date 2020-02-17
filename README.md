# @creativepenguin/cdk-static-site

This construct deploys a static site including:

   * S3 Bucket
   * CloudFront Distribution
   * Route53 CNAME Records

## Usage

```typescript
import cdk = require('@aws-cdk/core');
import { StaticSite, StaticSiteProps } from '@creativepenguin/cdk-static-site';
const app = new cdk.App();

const staticSiteProps: StaticSiteProps = {
   env: { account: 'xxxxxxxxxxxxx', region: 'us-east-1' },
   domainName: 'example.com'
};

new StaticSite(app, 'unique-id', staticSiteProps);
```

## Options

### `domainName`

A custom domain alias for the CloudFront distribution

Supplying a custom domain name will trigger a lookup for the hosted zone in Route53 and a
certificate ARN value in SSM. Also CNAME records will be added to the Route53 hosted zone.

### `subdomains`

A list of subdomains to add CNAME records for. (Default: `[ 'www', '' ]`).

This value is ignored if no `domainName` is provided.

### `certificateARN`

An ARN for a certificate to associate with a custom domain alias in the CloudFront
distributions.

This value is ignored if no `domainName` is provided.

### `ssmCertificatePrefix`

A prefix for the SSM key used when looking up a certificate ARN. (Default: `/certificates/`)

This value is ignored if no `domainName` is provided.

## Manual Setup Procedures

The following must be done before running a deploy. If using a custom domain.

### Route53 Hosted Zone

The corresponding hosted zone must be setup in Route53.

### Certificate

A certificate corresponding to the domain and subdomains specified should be created and validated.

If using providing the certificate ARN through a SSM parameter lookup, the parameter must exist. By default, this should be saved with the key `/certificates/{domainName}`.
