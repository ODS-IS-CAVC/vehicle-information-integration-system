plugins {
    id("java")
    id("org.springframework.boot") version "3.3.4"
    id("io.spring.dependency-management") version "1.1.6"
    id("org.openapi.generator") version "7.9.0"
    id("jacoco")
}

group = "com.nttdata.vehicleinfo.space.search"
version = "1.0-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

sourceSets {
    main {
        java {
            srcDir("$buildDir/generated-openapi/src/main/java")
        }
    }
}

dependencies {
    implementation(project(":search-common"))
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    // ---- openapi generated ----
    implementation("org.springframework.data:spring-data-commons")
    // ---- SpringDoc dependencies
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.6.0")
    // ---- @Nullable annotation
    implementation("com.google.code.findbugs:jsr305:3.0.2")
    implementation("com.fasterxml.jackson.dataformat:jackson-dataformat-yaml")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")
    implementation("org.openapitools:jackson-databind-nullable:0.2.6")
    // ---- Bean Validation API support
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("com.fasterxml.jackson.core:jackson-databind")
    // ---- openapi generated ----
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
    testImplementation("org.testcontainers:junit-jupiter:1.19.8")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

openApiGenerate {
    generatorName.set("spring")
    inputSpec.set("$rootDir/openapi/openapi_space.yaml")
    outputDir.set("$buildDir/generated-openapi")
    apiPackage.set("com.nttdata.vehicleinfo.space.search.api")
    modelPackage.set("com.nttdata.vehicleinfo.space.search.model")
    configOptions.put("dateLibrary", "java8")
    configOptions.put("interfaceOnly", "true")
    configOptions.put("useSpringBoot3", "true")
}

jacoco {
    toolVersion = "0.8.12"
    reportsDirectory = layout.buildDirectory.dir("jacocoReport")
}

tasks.compileJava {
    dependsOn(tasks.openApiGenerate)
}

tasks.test {
    useJUnitPlatform()
    finalizedBy(tasks.jacocoTestReport) // report is always generated after tests run
}

tasks.jacocoTestReport {
    dependsOn(tasks.test) // tests are required to run before generating the report
}

tasks.jacocoTestReport {
    reports {
        xml.required = false
        csv.required = false
        html.outputLocation = layout.buildDirectory.dir("jacocoHtml")
    }

    // OpenAPIの自動生成クラスはJacocoのレポート対象外とする
    classDirectories.setFrom(files(classDirectories.files.map {
        fileTree(it) {
            setExcludes(
                listOf(
                    "**/com/nttdata/vehicleinfo/space/search/api/**",
                    "**/com/nttdata/vehicleinfo/space/search/model/**"
                )
            )
        }
    }))
}