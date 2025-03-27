plugins {
    java
    id("org.springframework.boot") version "3.3.4"
    id("io.spring.dependency-management") version "1.1.6"
    id("jacoco")
}

group = "com.nttdata.vehicleinfo.collection"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

dependencies {
    // vdl-api-client
    implementation(project(":vdl-api-client"))
    // time-spatial-index-creator
    implementation(project(":time-spatial-index-creator-weather"))
    // Geotemp
    implementation("jp.co.ntt.sic:Geotemp:1.1")
    // spring-boot-web
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-web")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    // spring-retry
    implementation("org.springframework.retry:spring-retry:2.0.9")
    // spring-validation
    implementation("org.springframework.boot:spring-boot-starter-validation")
    // TestContainer
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
    testImplementation("org.testcontainers:junit-jupiter:1.19.8")
    // spring-mockserver
    testImplementation("org.mock-server:mockserver-spring-test-listener:5.14.0")
    // masking
    implementation("net.thisptr:jackson-jq:1.2.0")
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