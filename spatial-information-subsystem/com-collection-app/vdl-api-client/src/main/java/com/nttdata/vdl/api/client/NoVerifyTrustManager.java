package com.nttdata.vdl.api.client;

import java.net.Socket;
import java.security.cert.X509Certificate;
import javax.net.ssl.SSLEngine;
import javax.net.ssl.X509ExtendedTrustManager;

/**
 * SSL証明書の検証およびホスト検証をしないTrustManager
 *
 * <p>poc環境においてSSL証明書の検証とホストの検証を無効化したい場合にのみ利用すること
 *
 * <p>参考:
 * https://stackoverflow.com/questions/4072585/disabling-ssl-certificate-validation-in-spring-resttemplate
 */
public class NoVerifyTrustManager extends X509ExtendedTrustManager {
  @Override
  public X509Certificate[] getAcceptedIssuers() {
    return new X509Certificate[] {};
  }

  @Override
  public void checkClientTrusted(X509Certificate[] chain, String authType) {}

  @Override
  public void checkClientTrusted(X509Certificate[] chain, String authType, Socket socket) {}

  @Override
  public void checkClientTrusted(X509Certificate[] chain, String authType, SSLEngine engine) {}

  @Override
  public void checkServerTrusted(X509Certificate[] chain, String authType) {}

  @Override
  public void checkServerTrusted(X509Certificate[] chain, String authType, Socket socket) {}

  @Override
  public void checkServerTrusted(X509Certificate[] chain, String authType, SSLEngine engine) {}
}
