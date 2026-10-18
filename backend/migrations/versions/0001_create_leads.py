"""Create leads with attribution and a phone/time lookup index."""

import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create persistent lead storage."""
    op.create_table(
        "leads",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(60), nullable=False),
        sa.Column("phone", sa.String(16), nullable=False),
        sa.Column("interest", sa.String(12), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        *[
            sa.Column(name, sa.String(255), nullable=True)
            for name in ("utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "yclid")
        ],
        sa.Column("referrer", sa.String(2048), nullable=True),
        sa.Column("landing_path", sa.String(2048), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("clock_timestamp()")
        ),
        sa.CheckConstraint("interest IN ('subscription', 'order', 'question')", name="ck_leads_interest"),
    )
    op.create_index("ix_leads_phone_created_at", "leads", ["phone", "created_at"])


def downgrade() -> None:
    """Remove the initial storage schema."""
    op.drop_index("ix_leads_phone_created_at", table_name="leads")
    op.drop_table("leads")
