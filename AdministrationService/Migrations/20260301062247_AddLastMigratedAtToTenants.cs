using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AdministrationService.Migrations
{
    /// <inheritdoc />
    public partial class AddLastMigratedAtToTenants : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastMigratedAt",
                table: "ADMIN_Tenants",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastMigratedAt",
                table: "ADMIN_Tenants");
        }
    }
}
