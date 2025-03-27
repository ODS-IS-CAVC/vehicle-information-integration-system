plugins {
    `java-library`
    id("jacoco")
    id("maven-publish") // CodeArtifact settings
}

group = "com.nttdata.vehicleinfo.collection"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // junit
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.3")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    testImplementation("ch.qos.logback:logback-classic:1.2.6")
}

tasks.withType<Test> {
    useJUnitPlatform()
}

// Jacoco settings
tasks.test {
    finalizedBy(tasks.jacocoTestReport) // report is always generated after tests run
}
tasks.jacocoTestReport {
    dependsOn(tasks.test) // tests are required to run before generating the report
}
jacoco {
    toolVersion = "0.8.12"
    reportsDirectory = layout.buildDirectory.dir("customJacocoReportDir")
}
tasks.jacocoTestReport {
    reports {
        xml.required = false
        csv.required = false
        html.outputLocation = layout.buildDirectory.dir("jacocoHtml")
    }
}

// CodeArtifact settings
val executeCodeArtifactGetAuthorizationToken: String by project
publishing {
    publications {
        create<MavenPublication>("library") {
            from(components["java"])
        }
    }
    repositories {
        maven {
            url =
                uri("https://nttd-tig-324037315774.d.codeartifact.ap-northeast-1.amazonaws.com/maven/com-space-codeartifact/")
            credentials {
                username = "aws"
                password = executeCodeArtifactGetAuthorizationToken
            }
        }
    }
}