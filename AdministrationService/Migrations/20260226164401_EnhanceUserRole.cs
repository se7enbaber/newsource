using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AdministrationService.Migrations
{
    /// <inheritdoc />
    public partial class EnhanceUserRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarJsonConfig",
                table: "ADMIN_Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AvatarUrl",
                table: "ADMIN_Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DateOfBirth",
                table: "ADMIN_Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FullName",
                table: "ADMIN_Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "ADMIN_Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsEmailVerified",
                table: "ADMIN_Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "ADMIN_Roles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "ADMIN_Roles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsSystemRole",
                table: "ADMIN_Roles",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvatarJsonConfig",
                table: "ADMIN_Users");

            migrationBuilder.DropColumn(
                name: "AvatarUrl",
                table: "ADMIN_Users");

            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "ADMIN_Users");

            migrationBuilder.DropColumn(
                name: "FullName",
                table: "ADMIN_Users");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "ADMIN_Users");

            migrationBuilder.DropColumn(
                name: "IsEmailVerified",
                table: "ADMIN_Users");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "ADMIN_Roles");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "ADMIN_Roles");

            migrationBuilder.DropColumn(
                name: "IsSystemRole",
                table: "ADMIN_Roles");
        }
    }
}
