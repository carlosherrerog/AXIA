"""add_fund_requests_table

Revision ID: f1a2b3c4d5e6
Revises: 22eef3448e1a
Create Date: 2026-05-29 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = '22eef3448e1a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS fund_requests (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            wallet_address VARCHAR(42) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            pol_amount FLOAT NOT NULL DEFAULT 1.0,
            usdc_amount FLOAT NOT NULL DEFAULT 1000.0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            processed_at TIMESTAMP,
            tx_hash_pol VARCHAR(66),
            tx_hash_usdc VARCHAR(66)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_fund_requests_id ON fund_requests(id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_fund_requests_user_id ON fund_requests(user_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS fund_requests")
