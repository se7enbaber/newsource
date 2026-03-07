using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AdministrationService.Migrations
{
    /// <inheritdoc />
    public partial class AddIsMigratedToTenant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsMigrated",
                table: "ADMIN_Tenants",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsMigrated",
                table: "ADMIN_Tenants");
        }
    }
}
