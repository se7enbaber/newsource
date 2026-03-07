using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AdministrationService.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ADMIN_TenantFeatures",
                columns: table => new
                {
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    FeatureCode = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ADMIN_TenantFeatures", x => new { x.TenantId, x.FeatureCode });
                    table.ForeignKey(
                        name: "FK_ADMIN_TenantFeatures_ADMIN_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "ADMIN_Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ADMIN_TenantFeatures");
        }
    }
}
