rootProject.allprojects {
    repositories {
        mavenCentral()
        maven {
            url =
                uri("https://nttd-tig-324037315774.d.codeartifact.ap-northeast-1.amazonaws.com/maven/com-space-codeartifact/")
            credentials {
                username = "aws"
                password = executeCodeArtifactGetAuthorizationToken()
            }
        }
    }
}

fun executeCodeArtifactGetAuthorizationToken(): String {
    // Gradleの実行時に1回だけ実行したいので結果をプロパティにキャッシュする
    val PROPERTY_NAME = "executeCodeArtifactGetAuthorizationToken";
    if (project.hasProperty(PROPERTY_NAME)) {
        return project.property(PROPERTY_NAME).toString()
    }
    // AWS CLIコマンドを実行
    val profile = project.property("AWS_PROFILE").toString()
    // $ aws --profile digiline codeartifact get-authorization-token --domain nttd-tig --domain-owner 324037315774 --region ap-northeast-1 --query authorizationToken --output text
    try {
        // AWS CLIのパスが通っていることを前提とする
        val process = ProcessBuilder(
            "aws",
            "--profile",
            profile,
            "codeartifact",
            "get-authorization-token",
            "--domain",
            "nttd-tig",
            "--domain-owner",
            "324037315774",
            "--region",
            "ap-northeast-1",
            "--query",
            "authorizationToken",
            "--output",
            "text"
        ).redirectErrorStream(true)
            .start()
        val output = process.inputStream.bufferedReader().use { it.readLine() }
        val exitCode = process.waitFor()
        if (exitCode == 0) {
            println("Get CodeArtifact auth token success.")
            project.extensions.extraProperties[PROPERTY_NAME] = output
            return output
        } else {
            throw RuntimeException("Error: Process exited with code: $exitCode")
        }
    } catch (e: Exception) {
        throw RuntimeException("Get CodeArtifact auth token failed. ${e.message}")
    }
}

