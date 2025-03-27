---
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: ${vdl_eks_cluster_name}
  region: ap-northeast-1
  version: "1.31" 

iam:
  withOIDC: true

privateCluster:
  enabled: true

managedNodeGroups:
- name: ${vdl_eks_nodegroup_name}
  availabilityZones: ["ap-northeast-1a"]
  amiFamily: Ubuntu2204
  instanceType: m5.2xlarge
  desiredCapacity: 3
  volumeSize: 100
  volumeType: gp3
  iam:
    instanceRoleARN: ${vdl_eks_nodegroup_iamrole_arn}
  privateNetworking: true
  ssh:
    allow: true
    publicKeyPath: iia-digiline-com-keypair
    sourceSecurityGroupIds: [${vdl_eks_nodegroup_security_groups}]