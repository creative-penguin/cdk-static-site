import * as cdk from '@aws-cdk/core';
import { Bucket, BucketAccessControl } from '@aws-cdk/aws-s3';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import { CloudFrontWebDistribution } from '@aws-cdk/aws-cloudfront';
import { HostedZone, AddressRecordTarget, ARecord, IHostedZone } from '@aws-cdk/aws-route53';
import { CloudFrontTarget } from '@aws-cdk/aws-route53-targets';
import { StringParameter } from '@aws-cdk/aws-ssm';

export interface StaticSiteProps extends cdk.StackProps {

   /**
    * If a domain is not provided, no CloudFront aliases will be setup. Only the default
    * cloudfront domain will be available.
    */
   domainName?: string;

   /**
    * Defaults to [ 'www', '' ]
    */
   subdomains?: string[];

   /**
    * If provided, the certificate ARN will be used and the SSM lookup will be bypassed.
    */
   certificateARN?: string;

   /**
    * This will be used to prefix the key for the certificate ARN in SSM.
    * Defaults to: /certificates/
    */
   ssmCertificatePrefix?: string;
}

export class StaticSite extends cdk.Stack {
   public constructor(scope: cdk.Construct, id: string, props?: StaticSiteProps) {
      super(scope, id, props);

      props = props || {};

      const subdomains = props.subdomains || [ 'www', '' ];

      let bucketName = id,
          zone: IHostedZone | undefined;

      if (props.domainName) {
         bucketName = (props.subdomains && props.subdomains[0].length) ? props.subdomains[0] + '.' + props.domainName : props.domainName;
      }

      const bucket = new Bucket(this, 'websiteBucket', {
         versioned: true,
         bucketName: bucketName,
         accessControl: BucketAccessControl.PUBLIC_READ,
         websiteIndexDocument: 'index.html',
         websiteErrorDocument: 'index.html',
         publicReadAccess: true,
      });

      const cloudFrontConfig: any = {
         originConfigs: [
            {
               s3OriginSource: {
                  s3BucketSource: bucket,
               },
               behaviors: [ { isDefaultBehavior: true } ],
            },
         ],
      };

      if (props.domainName) {
         const domain = props.domainName,
               aliases = getAliases(subdomains, domain),
               certPrefix = props.ssmCertificatePrefix || '/certificates/',
               certArn = props.certificateARN || StringParameter.valueFromLookup(this, certPrefix + domain);

         // The zone for this domain should already exist in Route53
         zone = HostedZone.fromLookup(this, 'hostedZone', { domainName: domain });

         cloudFrontConfig.aliasConfiguration = {
            acmCertRef: certArn,
            names: aliases,
         };
      }

      const distribution = new CloudFrontWebDistribution(this, 'websiteDistribution', cloudFrontConfig);

      if (zone && subdomains.length) {
         subdomains.forEach((subdomain) => {
            new ARecord(this, `ARecord-${subdomain}`, {
               recordName: subdomain,
               target: AddressRecordTarget.fromAlias(new CloudFrontTarget(distribution)),
               zone: zone as IHostedZone,
            });
         });
      }

      // Deploy the site files and invalidate the distribution cache
      new BucketDeployment(this, 's3Deploy', {
         destinationBucket: bucket,
         sources: [ Source.asset('./dist') ],
         distribution: distribution,
         distributionPaths: [ '/*' ],
      });

      new cdk.CfnOutput(this, 'Domain Name:', { value: distribution.domainName });
      new cdk.CfnOutput(this, 'Cloud Front Distribution ID:', { value: distribution.distributionId });
      new cdk.CfnOutput(this, 'Website Bucket', { value: bucket.bucketName });
   }
}

function getAliases(subdomains: string[], domain: string): string[] {
   return subdomains.map((subdomain) => {
      let alias = '';

      if (subdomain.length) {
         alias += subdomain + '.';
      }

      alias += domain;
      return alias;
   });
}
