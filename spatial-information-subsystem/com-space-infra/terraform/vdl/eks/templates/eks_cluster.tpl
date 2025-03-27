---
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: ${vdl_eks_cluster_name}
  region: ap-northeast-1
  version: "1.31" 

iam:
  withOIDC: true
  serviceRoleARN: ${vdl_eks_cluster_iamrole_arn}

vpc:
  id: ${vpc_id}
  subnets:
    private:
      ap-northeast-1a:
        id: ${vdl_subnet_private_azA_id}
      ap-northeast-1c:
        id: ${vdl_subnet_private_azC_id}
  sharedNodeSecurityGroup: ${vdl_eks_cluster_security_group}
  manageSharedNodeSecurityGroupRules: false

privateCluster:
  enabled: true
  skipEndpointCreation: true