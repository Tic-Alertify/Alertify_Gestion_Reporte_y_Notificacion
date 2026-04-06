pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
    repositories {
        google()
        maven { url = uri("https://repo.maven.apache.org/maven2/") }
        maven { url = uri("https://plugins.gradle.org/m2/") }
        mavenCentral()
    }
}

rootProject.name = "Alertify"
include(":app")
