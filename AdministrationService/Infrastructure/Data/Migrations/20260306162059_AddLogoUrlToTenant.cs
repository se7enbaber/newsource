using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AdministrationService.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLogoUrlToTenant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "ADMIN_Tenants",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "ADMIN_Tenants");
        }
    }
}
