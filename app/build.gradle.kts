plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)

    id("com.google.gms.google-services")
}

android {
    namespace = "com.alertify.app"
    compileSdk {
        version = release(36)
    }

    defaultConfig {
        applicationId = "com.alertify.app"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlinOptions {
        jvmTarget = "11"
    }
    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.activity)
    implementation(libs.androidx.constraintlayout)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)

    // 1. Networking: Retrofit para conectar con el microservicio NestJS
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.11.0")

    // 2. Google Play Services: Mapas y Ubicación (Vital para el reporte)
    implementation("com.google.android.gms:play-services-maps:18.2.0")
    implementation("com.google.android.gms:play-services-location:21.1.0")

    // 3. Firebase: Para recibir las alertas del microservicio (Punto 5 - Imagen 1)

    // Firebase BOM
    implementation(platform("com.google.firebase:firebase-bom:32.8.1"))

    // Firebase Messaging
    implementation("com.google.firebase:firebase-messaging-ktx")

    // Fragmentos y Ciclo de vida
    implementation("androidx.fragment:fragment-ktx:1.6.2")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")

    // Navigation Component (Necesario para moverte entre pantallas)
    implementation("androidx.navigation:navigation-fragment-ktx:2.7.6")
    implementation("androidx.navigation:navigation-ui-ktx:2.7.6")

}